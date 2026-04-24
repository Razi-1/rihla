import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { subjectService } from '@/services/subjectService';
import type { Subject, EducationLevel } from '@/types/common';
import type { SearchFilters } from '@/services/searchService';
import styles from './FilterPanel.module.css';

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export default function FilterPanel({ filters, onChange }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<EducationLevel[]>([]);

  useEffect(() => {
    subjectService.getSubjects().then((r) => setSubjects(r.data.data));
    subjectService.getEducationLevels().then((r) => setLevels(r.data.data));
  }, []);

  const update = (key: keyof SearchFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Filter size={16} strokeWidth={1.5} />
        <span>Filters</span>
      </div>

      <Select
        label="Subject"
        placeholder="All subjects"
        options={subjects.map((s) => ({ value: s.id, label: s.name }))}
        value={filters.subject_id ?? ''}
        onChange={(e) => update('subject_id', e.target.value)}
      />

      <Select
        label="Education Level"
        placeholder="All levels"
        options={levels.map((l) => ({ value: l.id, label: l.name }))}
        value={filters.education_level_id ?? ''}
        onChange={(e) => update('education_level_id', e.target.value)}
      />

      <Select
        label="Mode"
        placeholder="All modes"
        options={[
          { value: 'online', label: 'Online' },
          { value: 'physical', label: 'In-Person' },
          { value: 'hybrid', label: 'Hybrid' },
        ]}
        value={filters.mode ?? ''}
        onChange={(e) => update('mode', e.target.value)}
      />

      <Select
        label="Gender"
        placeholder="Any gender"
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ]}
        value={filters.gender ?? ''}
        onChange={(e) => update('gender', e.target.value)}
      />

      <div className={styles.row}>
        <Input
          label="Min Price"
          type="number"
          placeholder="0"
          value={filters.min_rate ?? ''}
          onChange={(e) => update('min_rate', e.target.value)}
        />
        <Input
          label="Max Price"
          type="number"
          placeholder="Any"
          value={filters.max_rate ?? ''}
          onChange={(e) => update('max_rate', e.target.value)}
        />
      </div>

      <Button variant="secondary" fullWidth onClick={() => onChange({})}>
        Clear Filters
      </Button>
    </div>
  );
}
