'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SlideOver({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  size = 'lg' 
}: SlideOverProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      default: return 'max-w-lg';
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Slide over panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className={`pointer-events-auto w-screen ${getSizeClasses()}`}>
                  <div className="flex h-full flex-col overflow-y-scroll bg-background border-l shadow-xl">
                    {/* Header */}
                    {(title || description) && (
                      <div className="bg-background px-6 py-6 border-b">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            {title && (
                              <Dialog.Title className="text-lg font-semibold text-foreground">
                                {title}
                              </Dialog.Title>
                            )}
                            {description && (
                              <p className="text-sm text-muted-foreground">
                                {description}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 flex h-7 items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={onClose}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <span className="sr-only">Close panel</span>
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 px-6 py-6">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}