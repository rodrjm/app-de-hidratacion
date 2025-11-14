import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useRecordatoriosStore } from '@/store/recordatoriosStore';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { RecordatorioForm } from '@/types';

const diasSemanaLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const defaultForm: RecordatorioForm = {
  hora: '08:00',
  mensaje: '',
  dias_semana: [1,2,3,4,5],
  tipo_recordatorio: 'agua',
  frecuencia: 'diario',
  sonido: 'default',
  vibracion: true
};

const Recordatorios: React.FC = () => {
  const { recordatorios, isLoading, fetchRecordatorios, addRecordatorio, updateRecordatorio, deleteRecordatorio } = useRecordatoriosStore();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RecordatorioForm>(defaultForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRecordatorios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setIsEditing(false);
    setEditingId(null);
    setSubmitError(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (rec: Recordatorio) => {
    setForm({
      hora: rec.hora || '08:00',
      mensaje: rec.mensaje || '',
      dias_semana: rec.dias_semana || [1,2,3,4,5],
      tipo_recordatorio: rec.tipo_recordatorio || 'agua',
      frecuencia: rec.frecuencia || 'diario',
      sonido: rec.sonido || 'default',
      vibracion: !!rec.vibracion
    });
    setIsEditing(true);
    setEditingId(rec.id);
    setShowModal(true);
  };

  const toggleDia = (diaIndex: number) => {
    setForm(prev => {
      const exists = prev.dias_semana.includes(diaIndex + 1);
      const dias = exists ? prev.dias_semana.filter(d => d !== (diaIndex + 1)) : [...prev.dias_semana, (diaIndex + 1)];
      return { ...prev, dias_semana: dias.sort((a,b) => a-b) };
    });
  };

  const validate = () => {
    if (!form.hora) return 'La hora es requerida';
    if (!form.dias_semana || form.dias_semana.length === 0) return 'Selecciona al menos un día';
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) { setSubmitError(v); return; }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isEditing && editingId) {
        await updateRecordatorio(editingId, form);
      } else {
        await addRecordatorio(form);
      }
      setShowModal(false);
      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar recordatorio';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este recordatorio?')) return;
    try {
      await deleteRecordatorio(id);
    } catch (e: unknown) {
      // surface error
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-700">Recordatorios</h1>
            <p className="text-sm text-neutral-600">Configura recordatorios para mantener tu hidratación</p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Recordatorio
          </Button>
        </div>

        <Card>
          <div className="divide-y divide-neutral-100">
            {isLoading && (
              <div className="p-6 text-center text-neutral-500">Cargando...</div>
            )}
            {!isLoading && recordatorios.length === 0 && (
              <div className="p-6 text-center text-neutral-500">Aún no tienes recordatorios. Crea uno para empezar.</div>
            )}
            {recordatorios.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-display font-medium text-neutral-700">{r.mensaje || 'Recordatorio de hidratación'}</p>
                  <p className="text-sm text-neutral-500">{r.hora} · {r.frecuencia} · Días: {r.dias_semana?.map((d: number) => diasSemanaLabels[(d - 1 + 7) % 7]).join(' ')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-neutral-700">{isEditing ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-3 text-sm">{submitError}</div>
            )}

            <div className="space-y-4">
              <Input
                label="Hora"
                type="time"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
              />
              <Input
                label="Mensaje (opcional)"
                placeholder="Ej. Toma agua ahora"
                value={form.mensaje || ''}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              />

              <div>
                <p className="block text-sm font-display font-medium text-neutral-700 mb-2">Días de la semana</p>
                <div className="grid grid-cols-7 gap-2">
                  {diasSemanaLabels.map((lbl, idx) => {
                    const activo = form.dias_semana.includes(idx + 1);
                    return (
                      <button
                        key={lbl}
                        type="button"
                        className={`px-3 py-2 rounded-md text-sm border font-display ${activo ? 'bg-accent-500 text-white border-accent-500' : 'bg-white text-neutral-700 border-neutral-300'}`}
                        onClick={() => toggleDia(idx)}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tipo-recordatorio" className="block text-sm font-display font-medium text-neutral-700 mb-2">Tipo</label>
                  <select
                    id="tipo-recordatorio"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={form.tipo_recordatorio}
                    onChange={(e) => setForm({ ...form, tipo_recordatorio: e.target.value })}
                  >
                    <option value="agua">Agua</option>
                    <option value="meta">Meta</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="frecuencia" className="block text-sm font-display font-medium text-neutral-700 mb-2">Frecuencia</label>
                  <select
                    id="frecuencia"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={form.frecuencia}
                    onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
                  >
                    <option value="diario">Diario</option>
                    <option value="dias_laborales">Días laborales</option>
                    <option value="fines_semana">Fines de semana</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sonido" className="block text-sm font-display font-medium text-neutral-700 mb-2">Sonido</label>
                  <input
                    id="sonido"
                    type="text"
                    placeholder="default"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    value={form.sonido}
                    onChange={(e) => setForm({ ...form, sonido: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="vibracion"
                    type="checkbox"
                    className="h-4 w-4 text-accent-600 border-neutral-300 rounded mr-2"
                    checked={form.vibracion}
                    onChange={(e) => setForm({ ...form, vibracion: e.target.checked })}
                  />
                  <label htmlFor="vibracion" className="text-sm text-neutral-700">Vibración</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
                {isEditing ? 'Guardar cambios' : 'Crear'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recordatorios;
