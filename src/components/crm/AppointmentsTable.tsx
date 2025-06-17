
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, MapPin, Phone, Mail, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import AppointmentModal from './AppointmentModal';
import { format } from 'date-fns';

export default function AppointmentsTable() {
  const { appointments, isLoading, updateAppointment, deleteAppointment } = useAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (appointment: Appointment, newStatus: string) => {
    await updateAppointment.mutateAsync({
      id: appointment.id,
      status: newStatus
    });
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleDelete = async (appointmentId: string) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      await deleteAppointment.mutateAsync(appointmentId);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading appointments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seeker</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments?.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{appointment.seeker_name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      {appointment.seeker_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {appointment.seeker_phone}
                        </span>
                      )}
                      {appointment.seeker_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {appointment.seeker_email}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{format(new Date(appointment.appointment_date), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{appointment.appointment_type.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {appointment.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{appointment.location}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{appointment.duration_minutes} min</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                        Edit
                      </DropdownMenuItem>
                      {appointment.status === 'scheduled' && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(appointment, 'confirmed')}>
                          Mark as Confirmed
                        </DropdownMenuItem>
                      )}
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(appointment, 'completed')}>
                          Mark as Completed
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleStatusUpdate(appointment, 'cancelled')}>
                        Cancel
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(appointment.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {(!appointments || appointments.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No appointments found. Create your first appointment to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />
    </div>
  );
}
