import {
  CalendarIcon,
  PersonIcon,
  ArchiveIcon,
  CardStackIcon,
  ArrowTopRightIcon,
  FileTextIcon,
} from "@radix-ui/react-icons";

export default function RecentActivityWidget({
  title = "Recent Activity",
  onViewAll,
  activities = [
    {
      id: 1,
      title: "New appointment #1234",
      time: "2 minutes ago",
      icon: CalendarIcon,
      tone: "apricot",
    },
    {
      id: 2,
      title: "New patient registered",
      time: "1 hour ago",
      icon: PersonIcon,
      tone: "apricot",
    },
    {
      id: 3,
      title: "Revenue milestone achieved",
      time: "3 hours ago",
      icon: CardStackIcon,
      tone: "apricot",
    },
    {
      id: 4,
      title: "Medicine catalog updated",
      time: "5 hours ago",
      icon: ArchiveIcon,
      tone: "apricot",
    },
  ],
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground tracking-tight">
          {title}
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline transition-colors flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowTopRightIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {activities.map((item) => {
          const Icon = item.icon || FileTextIcon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3.5 rounded-2xl p-2 hover:bg-secondary/60 transition-colors"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/40 shrink-0">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                  {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
