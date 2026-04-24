import api from '@/lib/axios';
import axios from 'axios';
import type { EducationLevel, SubjectCategory } from '@/types/admin';

export async function getSubjectCategories(): Promise<SubjectCategory[]> {
  const res = await axios.get<SubjectCategory[]>('/api/v1/subjects/categories');
  return res.data;
}

export async function getEducationLevels(): Promise<EducationLevel[]> {
  const res = await axios.get<EducationLevel[]>('/api/v1/education-levels');
  return res.data;
}

export async function createCategory(name: string, displayOrder: number): Promise<void> {
  await api.post('/subjects/categories', { name, display_order: displayOrder });
}

export async function createSubject(
  categoryId: string,
  name: string,
  displayOrder: number,
  educationLevelIds: string[],
): Promise<void> {
  await api.post('/subjects', {
    category_id: categoryId,
    name,
    display_order: displayOrder,
    education_level_ids: educationLevelIds,
  });
}

export async function updateSubject(
  id: string,
  data: { name?: string; display_order?: number; education_level_ids?: string[] },
): Promise<void> {
  await api.put(`/subjects/${id}`, data);
}

export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/subjects/${id}`);
}
