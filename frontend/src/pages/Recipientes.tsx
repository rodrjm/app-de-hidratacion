import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsumosStore } from '@/store/consumosStore';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Edit2, Trash2, X, Crown } from 'lucide-react';
import { Recipiente } from '@/types';

interface RecipienteForm {
  nombre: string;
  cantidad_ml: number;
  color?: string;
}

const COLOR_PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F472B6', '#64748B'];

const Recipientes: React.FC = () => {
  const { recipientes, fetchRecipientes, addRecipiente, updateRecipiente, deleteRecipiente } = useConsumosStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RecipienteForm>({ nombre: '', cantidad_ml: 250, color: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ nombre: '', cantidad_ml: 250, color: '' });
    setIsEditing(false);
    setEditingId(null);
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (rec: Recipiente) => {
    setForm({ nombre: rec.nombre || '', cantidad_ml: rec.cantidad_ml || 250, color: rec.color || '' });
    setIsEditing(true);
    setEditingId(rec.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este recipiente?')) return;
    try {
      await deleteRecipiente(id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar';
      setError(msg);
    }
  };

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es requerido';
    if (!form.cantidad_ml || form.cantidad_ml <= 0) return 'La cantidad (ml) debe ser mayor a 0';
    return null;
  };

  const handleSubmit = async () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // No enviar color si está vacío para que el backend use el valor por defecto
      const payload: Partial<Recipiente> = { nombre: form.nombre, cantidad_ml: form.cantidad_ml } as Partial<Recipiente>;
      if (form.color && form.color.trim()) {
        payload.color = form.color.trim();
      }

      if (isEditing && editingId) {
        await updateRecipiente(editingId, payload);
      } else {
        await addRecipiente(payload);
      }
      setShowModal(false);
      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-700">Recipientes</h1>
            <p className="text-sm text-neutral-600">Gestiona tus recipientes para registrar consumos con precisión</p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate} disabled={!user?.es_premium}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Recipiente
          </Button>
        </div>

        <Card>
          <div className="divide-y divide-neutral-100">
            {recipientes.length === 0 && (
              <div className="p-6 text-center text-neutral-500">Aún no tienes recipientes. Crea uno nuevo para empezar.</div>
            )}
            {recipientes.map((rec) => (
              <div key={rec.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold" style={{ backgroundColor: (rec.color || '#EEF2FF') }}>
                    {rec.cantidad_ml}
                  </div>
                  <div>
                    <p className="font-display font-medium text-neutral-700">{rec.nombre}</p>
                    <p className="text-sm text-neutral-500">{rec.cantidad_ml} ml</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(rec)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(rec.id)} disabled={rec.cantidad_ml === 250 || rec.cantidad_ml === 500}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Mensaje motivacional para usuarios gratuitos */}
          {!user?.es_premium && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="bg-accent-50 border border-accent-100 rounded-lg p-4 text-center">
                <Crown className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
                <h4 className="font-display font-bold text-neutral-700 mb-1">
                  Crea recipientes ilimitados con Premium
                </h4>
                <p className="text-sm text-neutral-600 mb-3">
                  Los usuarios gratuitos tienen sólo 2 recipientes. Con Premium, crea todos los recipientes que necesites.
                </p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate('/premium')}
                >
                  Ver Premium
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-neutral-700">
                {isEditing ? 'Editar Recipiente' : 'Nuevo Recipiente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Nombre"
                placeholder="Ej. Vaso, Botella, Taza"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
              <Input
                label="Cantidad (ml)"
                type="number"
                placeholder="250"
                value={form.cantidad_ml}
                onChange={(e) => setForm({ ...form, cantidad_ml: Number(e.target.value) })}
              />

              <div>
                <p className="block text-sm font-display font-medium text-neutral-700 mb-2">Color (opcional)</p>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-8 w-8 rounded-full border ${form.color === c ? 'ring-2 ring-offset-2 ring-accent-500' : 'border-neutral-200'}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Seleccionar color ${c}`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, color: '' })}
                    className={`h-8 w-8 rounded-full border border-dashed ${!form.color ? 'ring-2 ring-offset-2 ring-accent-500' : 'border-neutral-300'}`}
                    aria-label="Sin color (usar por defecto)"
                  >
                    
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-2">Si no eliges color, se usará el color por defecto.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
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

export default Recipientes;
