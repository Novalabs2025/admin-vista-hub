
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Users, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const notifications = [
    {
        id: 1,
        icon: Users,
        title: "New agent pending approval",
        description: "Agent 'City Real Estate' has submitted their documents for verification.",
        time: "15 minutes ago",
    },
    {
        id: 2,
        icon: Bell,
        title: "System update scheduled",
        description: "A system update is scheduled for tonight at 2 AM. Expect brief downtime.",
        time: "2 hours ago",
    },
    {
        id: 3,
        icon: FileText,
        title: "Agent 'Landmark Properties' rejected",
        description: "The verification for Landmark Properties was rejected due to incomplete documents.",
        time: "1 day ago",
    },
];


const NotificationsFeed = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Recent system events and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg border">
                        <Avatar className="h-9 w-9 flex items-center justify-center bg-secondary">
                           <notification.icon className="h-5 w-5 text-secondary-foreground" />
                        </Avatar>
                        <div className="grid gap-1">
                            <p className="font-semibold">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                            <p className="text-xs text-muted-foreground">{notification.time}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default NotificationsFeed;
