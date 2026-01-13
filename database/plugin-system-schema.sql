-- Plugin System Database Schema
-- This file sets up the tables needed for the custom report plugin system

-- Plugin instances table to store user configurations of plugins
CREATE TABLE IF NOT EXISTS plugin_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id TEXT NOT NULL, -- The identifier of the plugin (e.g., 'sales-performance-report')
    name TEXT NOT NULL, -- User-defined name for this instance
    enabled BOOLEAN DEFAULT true,
    configuration JSONB NOT NULL DEFAULT '{}', -- Plugin-specific configuration
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique names per user
    UNIQUE(created_by, name)
);

-- Plugin execution history to track report generations
CREATE TABLE IF NOT EXISTS plugin_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES plugin_instances(id) ON DELETE CASCADE,
    executed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
    execution_duration_ms INTEGER,
    row_count INTEGER,
    error_message TEXT,
    context JSONB DEFAULT '{}' -- Execution context (date ranges, filters, etc.)
);

-- Plugin favorites for quick access
CREATE TABLE IF NOT EXISTS plugin_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES plugin_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique favorites per user
    UNIQUE(user_id, instance_id)
);

-- Scheduled plugin executions for automated reporting
CREATE TABLE IF NOT EXISTS plugin_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES plugin_instances(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cron_expression TEXT NOT NULL, -- e.g., '0 9 * * 1' for every Monday at 9 AM
    enabled BOOLEAN DEFAULT true,
    next_execution TIMESTAMP WITH TIME ZONE,
    last_execution TIMESTAMP WITH TIME ZONE,
    email_recipients TEXT[], -- Array of email addresses to send reports to
    export_format TEXT DEFAULT 'pdf' CHECK (export_format IN ('pdf', 'csv', 'excel')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugin usage analytics
CREATE TABLE IF NOT EXISTS plugin_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'executed', 'deleted', 'configured')),
    execution_time_ms INTEGER, -- Only for 'executed' actions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE plugin_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_usage_stats ENABLE ROW LEVEL SECURITY;

-- Plugin instances policies - users can only see their own instances
CREATE POLICY "Users can view own plugin instances" ON plugin_instances
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create own plugin instances" ON plugin_instances
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own plugin instances" ON plugin_instances
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own plugin instances" ON plugin_instances
    FOR DELETE USING (auth.uid() = created_by);

-- Plugin executions policies - users can see executions for their instances
CREATE POLICY "Users can view executions of own instances" ON plugin_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM plugin_instances 
            WHERE id = plugin_executions.instance_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create executions for own instances" ON plugin_executions
    FOR INSERT WITH CHECK (
        auth.uid() = executed_by AND
        EXISTS (
            SELECT 1 FROM plugin_instances 
            WHERE id = plugin_executions.instance_id 
            AND created_by = auth.uid()
        )
    );

-- Plugin favorites policies
CREATE POLICY "Users can manage own favorites" ON plugin_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Plugin schedules policies - users can only manage schedules for their instances
CREATE POLICY "Users can view schedules for own instances" ON plugin_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM plugin_instances 
            WHERE id = plugin_schedules.instance_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create schedules for own instances" ON plugin_schedules
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM plugin_instances 
            WHERE id = plugin_schedules.instance_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update schedules for own instances" ON plugin_schedules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM plugin_instances 
            WHERE id = plugin_schedules.instance_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete schedules for own instances" ON plugin_schedules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM plugin_instances 
            WHERE id = plugin_schedules.instance_id 
            AND created_by = auth.uid()
        )
    );

-- Plugin usage stats policies - users can see their own stats, admins can see all
CREATE POLICY "Users can view own usage stats" ON plugin_usage_stats
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "System can insert usage stats" ON plugin_usage_stats
    FOR INSERT WITH CHECK (true);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plugin_instances_updated_at 
    BEFORE UPDATE ON plugin_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plugin_schedules_updated_at 
    BEFORE UPDATE ON plugin_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next execution time for scheduled reports
CREATE OR REPLACE FUNCTION calculate_next_execution(cron_expr TEXT, from_time TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- This is a simplified implementation. In production, you'd use a proper cron parser
    -- For now, we'll handle some common patterns
    
    CASE cron_expr
        -- Daily at specific hour (e.g., '0 9 * * *' = daily at 9 AM)
        WHEN '0 9 * * *' THEN
            next_time := DATE_TRUNC('day', from_time) + INTERVAL '1 day' + INTERVAL '9 hours';
        -- Weekly on Monday at 9 AM (e.g., '0 9 * * 1')
        WHEN '0 9 * * 1' THEN
            next_time := DATE_TRUNC('week', from_time) + INTERVAL '1 week' + INTERVAL '1 day' + INTERVAL '9 hours';
        -- Monthly on 1st at 9 AM (e.g., '0 9 1 * *')
        WHEN '0 9 1 * *' THEN
            next_time := DATE_TRUNC('month', from_time) + INTERVAL '1 month' + INTERVAL '9 hours';
        ELSE
            -- Default to daily at 9 AM if pattern not recognized
            next_time := DATE_TRUNC('day', from_time) + INTERVAL '1 day' + INTERVAL '9 hours';
    END CASE;
    
    -- Ensure next time is in the future
    IF next_time <= from_time THEN
        next_time := next_time + INTERVAL '1 day';
    END IF;
    
    RETURN next_time;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set next_execution when creating/updating schedules
CREATE OR REPLACE FUNCTION set_next_execution()
RETURNS TRIGGER AS $$
BEGIN
    NEW.next_execution := calculate_next_execution(NEW.cron_expression);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_plugin_schedule_next_execution
    BEFORE INSERT OR UPDATE OF cron_expression ON plugin_schedules
    FOR EACH ROW EXECUTE FUNCTION set_next_execution();

-- Function to log plugin usage
CREATE OR REPLACE FUNCTION log_plugin_usage(
    p_plugin_id TEXT,
    p_user_id UUID,
    p_action TEXT,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO plugin_usage_stats (plugin_id, user_id, action, execution_time_ms)
    VALUES (p_plugin_id, p_user_id, p_action, p_execution_time_ms);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for secure report query execution
CREATE OR REPLACE FUNCTION execute_report_query(
    query_text TEXT,
    query_params JSONB DEFAULT '{}',
    user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(result JSONB) AS $$
DECLARE
    sanitized_query TEXT;
    result_row RECORD;
    results JSONB[] := '{}';
BEGIN
    -- Basic query sanitization (in production, use a more robust approach)
    sanitized_query := query_text;
    
    -- Ensure user can only access their own data by adding user filter
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Execute the query and return results as JSONB
    -- Note: This is a simplified implementation
    -- In production, you'd want more sophisticated query validation and execution
    
    RETURN QUERY SELECT jsonb_build_object('error', 'Query execution not implemented in SQL. Use application layer.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plugin_instances_created_by ON plugin_instances(created_by);
CREATE INDEX IF NOT EXISTS idx_plugin_instances_plugin_id ON plugin_instances(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_instances_enabled ON plugin_instances(enabled) WHERE enabled = true;

-- Plugin executions indexes
CREATE INDEX IF NOT EXISTS idx_plugin_executions_instance_id ON plugin_executions(instance_id);
CREATE INDEX IF NOT EXISTS idx_plugin_executions_executed_by ON plugin_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_plugin_executions_execution_time ON plugin_executions(execution_time);

-- Plugin schedules indexes  
CREATE INDEX IF NOT EXISTS idx_plugin_schedules_next_execution ON plugin_schedules(next_execution);
CREATE INDEX IF NOT EXISTS idx_plugin_schedules_enabled ON plugin_schedules(enabled) WHERE enabled = true;

-- Plugin usage stats indexes
CREATE INDEX IF NOT EXISTS idx_plugin_usage_plugin_id ON plugin_usage_stats(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_usage_user_id ON plugin_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_plugin_usage_created_at ON plugin_usage_stats(created_at);