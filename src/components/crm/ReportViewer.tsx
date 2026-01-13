'use client'

import React, { useState, useMemo } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Download, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react'
import { ReportData, ReportField } from '@/lib/types/plugins'

interface ReportViewerProps {
  reportData: ReportData
  title: string
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void
}

type SortDirection = 'asc' | 'desc' | null

export function ReportViewer({ reportData, title, onExport }: ReportViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filterField, setFilterField] = useState<string | null>(null)
  const [filterValue, setFilterValue] = useState('')

  const sortableFields = useMemo(() => 
    reportData.fields.filter(field => field.sortable), 
    [reportData.fields]
  )

  const filterableFields = useMemo(() => 
    reportData.fields.filter(field => field.filterable), 
    [reportData.fields]
  )

  const filteredAndSortedData = useMemo(() => {
    let data = [...reportData.rows]

    // Apply search filter
    if (searchTerm) {
      data = data.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply field filter
    if (filterField && filterValue) {
      data = data.filter(row => 
        String(row[filterField]).toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    // Apply sorting
    if (sortField && sortDirection) {
      data.sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]
        
        let comparison = 0
        if (aVal < bVal) comparison = -1
        else if (aVal > bVal) comparison = 1
        
        return sortDirection === 'desc' ? -comparison : comparison
      })
    }

    return data
  }, [reportData.rows, searchTerm, filterField, filterValue, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => 
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      )
      if (sortDirection === 'desc') {
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatCellValue = (value: any, field: ReportField) => {
    if (value === null || value === undefined) return '-'
    
    switch (field.type) {
      case 'currency':
        return typeof value === 'string' ? value : `$${Number(value).toLocaleString()}`
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : value
      case 'number':
        return Number(value).toLocaleString()
      case 'boolean':
        return value ? 'Yes' : 'No'
      default:
        return String(value)
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Total: {reportData.metadata.totalRows} rows</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Generated: {reportData.metadata.generatedAt.toLocaleString()}
              </span>
            </div>
          </div>
          
          {onExport && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport('csv')}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport('excel')}
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Excel
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search all fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>

          {filterableFields.length > 0 && (
            <>
              <Select value={filterField || ''} onValueChange={setFilterField}>
                <SelectTrigger className="w-[150px] h-8">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No filter</SelectItem>
                  {filterableFields.map(field => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filterField && (
                <Input
                  placeholder={`Filter ${filterableFields.find(f => f.key === filterField)?.label}...`}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="h-8 w-[150px]"
                />
              )}
            </>
          )}

          <Badge variant="secondary" className="h-8 flex items-center">
            <Filter className="h-3 w-3 mr-1" />
            {filteredAndSortedData.length} of {reportData.metadata.totalRows}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {reportData.fields.map(field => (
                  <TableHead 
                    key={field.key} 
                    className={`${field.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => field.sortable && handleSort(field.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{field.label}</span>
                      {field.sortable && (
                        <div className="flex items-center gap-1">
                          {getSortIcon(field.key)}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.length > 0 ? (
                filteredAndSortedData.map((row, index) => (
                  <TableRow key={index}>
                    {reportData.fields.map(field => (
                      <TableCell key={field.key}>
                        {formatCellValue(row[field.key], field)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={reportData.fields.length}
                    className="text-center py-8 text-gray-500"
                  >
                    No data found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}