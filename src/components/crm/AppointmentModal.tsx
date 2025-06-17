
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
}

export default function AppointmentModal({ isOpen, onClose, appointment }: AppointmentModalProps) {
  const { createAppointment, updateAppointment } = useAppointments();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    seeker_name: appointment?.seeker_name || '',
    seeker_email: appointment?.seeker_email || '',
    seeker_phone: appointment?.seeker_phone || '',
    appointment_date: appointment?.appointment_date ? new Date(appointment.appointment_date).toISOString().slice(0, 16) : '',
    appointment_type: appointment?.appointment_type || 'property_viewing',
    location: appointment?.location || '',
    duration_minutes: appointment?.duration_minutes || 60,
    notes: appointment?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    const appointmentData = {
      ...formData,
      agent_id: user.id,
      appointment_date: new Date(formData.appointment_date).toISOString(),
    };

    try {
      if (appointment) {
        await updateAppointment.mutateAsync({ id: appointment.id, ...appointmentData });
      } else {
        await createAppointment.mutateAsync(appointmentData);
      }
      onClose();
      setFormData({
        seeker_name: '',
        seeker_email: '',
        seeker_phone: '',
        appointment_date: '',
        appointment_type: 'property_viewing',
        location: '',
        duration_minutes: 60,
        notes: '',
      });
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Edit Appointment' : 'Create New Appointment'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="seeker_name">Seeker Name *</Label>
            <Input
              id="seeker_name"
              value={formData.seeker_name}
              onChange={(e) => handleChange('seeker_name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="seeker_email">Email</Label>
            <Input
              id="seeker_email"
              type="email"
              value={formData.seeker_email}
              onChange={(e) => handleChange('seeker_email', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="seeker_phone">Phone</Label>
            <Input
              id="seeker_phone"
              value={formData.seeker_phone}
              onChange={(e) => handleChange('seeker_phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="appointment_date">Date & Time *</Label>
            <Input
              id="appointment_date"
              type="datetime-local"
              value={formData.appointment_date}
              onChange={(e) => handleChange('appointment_date', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="appointment_type">Type</Label>
            <Select value={formData.appointment_type} onValueChange={(value) => handleChange('appointment_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="property_viewing">Property Viewing</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input
              id="duration_minutes"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAppointment.isPending || updateAppointment.isPending}>
              {appointment ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
