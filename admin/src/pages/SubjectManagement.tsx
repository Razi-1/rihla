import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronRight, Trash2, Edit3, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  getSubjectCategories,
  getEducationLevels,
  createCategory,
  createSubject,
  updateSubject,
  deleteSubject,
} from '@/services/subjectService';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import type { SubjectCategory, Subject, EducationLevel } from '@/types/admin';
import styles from './SubjectManagement.module.css';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  display_order: z.coerce.number().int().min(0),
});

const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  display_order: z.coerce.number().int().min(0),
  education_level_ids: z.array(z.string()).min(1, 'Select at least one level'),
});

type CategoryForm = z.infer<typeof categorySchema>;
type SubjectForm = z.infer<typeof subjectSchema>;

export default function SubjectManagementPage() {
  usePageTitle('Subject Management');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const categoriesFetcher = useCallback(() => getSubjectCategories(), []);
  const levelsFetcher = useCallback(() => getEducationLevels(), []);
  const { data: categories, loading, refetch } = useApi(categoriesFetcher);
  const { data: levels } = useApi(levelsFetcher);

  const {
    register: registerCat,
    handleSubmit: handleCatSubmit,
    reset: resetCat,
    formState: { errors: catErrors },
  } = useForm<CategoryForm>({ resolver: zodResolver(categorySchema), defaultValues: { display_order: 0 } });

  const {
    register: registerSub,
    handleSubmit: handleSubSubmit,
    reset: resetSub,
    setValue: setSubValue,
    watch: watchSub,
    formState: { errors: subErrors },
  } = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema), defaultValues: { display_order: 0, education_level_ids: [] } });

  const selectedLevels = watchSub('education_level_ids');

  const onCreateCategory = async (data: CategoryForm) => {
    setActionLoading(true);
    try {
      await createCategory(data.name, data.display_order);
      resetCat();
      setShowCategoryForm(false);
      refetch();
    } catch { /* handled */ } finally {
      setActionLoading(false);
    }
  };

  const onCreateSubject = async (data: SubjectForm) => {
    if (!showSubjectForm) return;
    setActionLoading(true);
    try {
      await createSubject(showSubjectForm, data.name, data.display_order, data.education_level_ids);
      resetSub();
      setShowSubjectForm(null);
      refetch();
    } catch { /* handled */ } finally {
      setActionLoading(false);
    }
  };

  const onUpdateSubject = async (data: SubjectForm) => {
    if (!editingSubject) return;
    setActionLoading(true);
    try {
      await updateSubject(editingSubject.id, {
        name: data.name,
        display_order: data.display_order,
        education_level_ids: data.education_level_ids,
      });
      setEditingSubject(null);
      resetSub();
      refetch();
    } catch { /* handled */ } finally {
      setActionLoading(false);
    }
  };

  const onDeleteSubject = async (id: string) => {
    setActionLoading(true);
    try {
      await deleteSubject(id);
      refetch();
    } catch { /* handled */ } finally {
      setActionLoading(false);
    }
  };

  const toggleLevel = (levelId: string) => {
    const current = selectedLevels ?? [];
    const next = current.includes(levelId)
      ? current.filter((id) => id !== levelId)
      : [...current, levelId];
    setSubValue('education_level_ids', next, { shouldValidate: true });
  };

  const startEdit = (subject: Subject) => {
    setEditingSubject(subject);
    resetSub({
      name: subject.name,
      display_order: subject.display_order,
      education_level_ids: subject.available_levels.map((l) => l.id),
    });
  };

  if (loading) {
    return (
      <>
        <AdminHeader title="Subject Management" />
        <div className={styles.content}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Subject Management"
        subtitle="Manage categories, subjects, and level availability"
        actions={
          <Button variant="primary" onClick={() => setShowCategoryForm(true)}>
            <Plus size={16} /> Add Category
          </Button>
        }
      />

      <div className={styles.content}>
        <AnimatePresence>
          {showCategoryForm && (
            <motion.div
              className={styles.formCard}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className={styles.formHeader}>
                <h3>New Category</h3>
                <button className={styles.closeBtn} onClick={() => setShowCategoryForm(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCatSubmit(onCreateCategory)} className={styles.formFields}>
                <Input label="Name" error={catErrors.name?.message} {...registerCat('name')} />
                <Input label="Display Order" type="number" error={catErrors.display_order?.message} {...registerCat('display_order')} />
                <Button type="submit" loading={actionLoading}>Create Category</Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {(categories ?? []).map((cat: SubjectCategory) => (
          <div key={cat.id} className={styles.categoryCard}>
            <button
              className={styles.categoryHeader}
              onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
            >
              {expandedCategory === cat.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className={styles.categoryName}>{cat.name}</span>
              <Badge variant="neutral">{cat.subjects.length} subjects</Badge>
            </button>

            <AnimatePresence>
              {expandedCategory === cat.id && (
                <motion.div
                  className={styles.subjectList}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {cat.subjects.map((sub: Subject) => (
                    <div key={sub.id} className={styles.subjectRow}>
                      {editingSubject?.id === sub.id ? (
                        <form onSubmit={handleSubSubmit(onUpdateSubject)} className={styles.editForm}>
                          <Input label="Name" error={subErrors.name?.message} {...registerSub('name')} />
                          <Input label="Order" type="number" {...registerSub('display_order')} />
                          <div className={styles.levelPicker}>
                            <span className={styles.levelLabel}>Levels:</span>
                            <div className={styles.levelChips}>
                              {(levels ?? []).map((level: EducationLevel) => (
                                <button
                                  key={level.id}
                                  type="button"
                                  className={`${styles.levelChip} ${(selectedLevels ?? []).includes(level.id) ? styles.levelSelected : ''}`}
                                  onClick={() => toggleLevel(level.id)}
                                >
                                  {level.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className={styles.editActions}>
                            <Button type="submit" size="sm" loading={actionLoading}>Save</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingSubject(null)}>Cancel</Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className={styles.subjectInfo}>
                            <span className={styles.subjectName}>{sub.name}</span>
                            <div className={styles.subjectLevels}>
                              {sub.available_levels.map((l) => (
                                <Badge key={l.id} variant="info">{l.name}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className={styles.subjectActions}>
                            <button className={styles.iconBtn} onClick={() => startEdit(sub)} title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button className={styles.iconBtn} onClick={() => onDeleteSubject(sub.id)} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {showSubjectForm === cat.id ? (
                    <form onSubmit={handleSubSubmit(onCreateSubject)} className={styles.addSubjectForm}>
                      <Input label="Subject Name" error={subErrors.name?.message} {...registerSub('name')} />
                      <Input label="Order" type="number" {...registerSub('display_order')} />
                      <div className={styles.levelPicker}>
                        <span className={styles.levelLabel}>Education Levels:</span>
                        <div className={styles.levelChips}>
                          {(levels ?? []).map((level: EducationLevel) => (
                            <button
                              key={level.id}
                              type="button"
                              className={`${styles.levelChip} ${(selectedLevels ?? []).includes(level.id) ? styles.levelSelected : ''}`}
                              onClick={() => toggleLevel(level.id)}
                            >
                              {level.name}
                            </button>
                          ))}
                        </div>
                        {subErrors.education_level_ids && (
                          <span className={styles.errorText}>{subErrors.education_level_ids.message}</span>
                        )}
                      </div>
                      <div className={styles.editActions}>
                        <Button type="submit" size="sm" loading={actionLoading}>Add Subject</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setShowSubjectForm(null); resetSub(); }}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className={styles.addSubjectBtn}
                      onClick={() => { setShowSubjectForm(cat.id); resetSub(); }}
                    >
                      <Plus size={14} /> Add Subject
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </>
  );
}
