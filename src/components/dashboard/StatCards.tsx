
import StatCard from "./StatCard";
import { Briefcase, Users, MessageSquare, Star } from "lucide-react";

const stats = [
  {
    title: "Active Properties",
    value: "1,247",
    icon: Briefcase,
  },
  {
    title: "Verified Agents",
    value: "89",
    icon: Users,
  },
  {
    title: "Conversations/Month",
    value: "3,456",
    icon: MessageSquare,
  },
  {
    title: "Average Rating",
    value: "4.7",
    icon: Star,
    isRating: true
  },
];

const StatCards = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} isRating={stat.isRating} />
      ))}
    </div>
  );
};

export default StatCards;
