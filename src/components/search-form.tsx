'use client';

import { useState } from 'react';
import { Search, Loader2, MapPin, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BUSINESS_CATEGORIES } from '@/types';
import type { SearchResponse } from '@/types';

interface SearchFormProps {
  onResults: (data: SearchResponse, city: string, category: string) => void;
  onError: (message: string) => void;
}

export function SearchForm({ onResults, onError }: SearchFormProps) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!city.trim()) {
      onError('Please enter a city name');
      return;
    }
    if (!category) {
      onError('Please select a business category');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), category }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data.error || 'Search failed');
        return;
      }

      onResults(data, city.trim(), category);
    } catch {
      onError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full'>
      <div className='rounded-xl border bg-card p-1 shadow-sm'>
        <div className='flex flex-col sm:flex-row'>
          {/* City Input */}
          <div className='relative flex-1 min-w-0'>
            <MapPin className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none' />
            <Input
              placeholder='City name (e.g. Austin, TX)'
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className='pl-10 h-11 border-0 shadow-none focus-visible:ring-0 rounded-lg bg-transparent text-sm'
              disabled={loading}
            />
          </div>

          {/* Divider */}
          <div className='hidden sm:flex items-center px-0.5'>
            <div className='w-px h-6 bg-border' />
          </div>
          <div className='sm:hidden mx-3'>
            <div className='h-px bg-border' />
          </div>

          {/* Category Select */}
          <div className='relative flex-1 min-w-0 sm:max-w-[260px]'>
            <LayoutGrid className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none z-10 ' />
            <Select
              value={category}
              onValueChange={(v) => setCategory(v ?? '')}
              disabled={loading}
            >
              <SelectTrigger className='pl-10 border-0 shadow-none focus-visible:ring-0 rounded-lg bg-transparent text-sm w-full data-[size=default]:h-11'>
                <SelectValue placeholder='Business type' />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className='p-1 sm:p-0 sm:pl-1'>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className='h-11 px-5 w-full sm:w-auto rounded-lg font-medium'
              size='lg'
            >
              {loading ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  <span className='ml-2'>Scanning…</span>
                </>
              ) : (
                <>
                  <Search className='size-4' />
                  <span className='ml-2'>Find Leads</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className='flex items-center gap-2 mt-4 px-1'>
          <div className='flex gap-1'>
            <span className='size-1.5 rounded-full bg-primary/60 animate-pulse' />
            <span className='size-1.5 rounded-full bg-primary/40 animate-pulse [animation-delay:150ms]' />
            <span className='size-1.5 rounded-full bg-primary/20 animate-pulse [animation-delay:300ms]' />
          </div>
          <p className='text-sm text-muted-foreground'>
            Searching Google Places & analyzing websites… ~15-30s
          </p>
        </div>
      )}
    </div>
  );
}
