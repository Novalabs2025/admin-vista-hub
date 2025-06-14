
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Notifications = () => {
  return (
    <main className="flex-1 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the notifications page. All system notifications will appear here.</p>
        </CardContent>
      </Card>
    </main>
  );
};

export default Notifications;
