import { statusConfig } from "../../utils/statusColors";

export default function StatusTimeline({ history }) {
  if (!history?.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Status Timeline
      </h3>
      <div className="relative">
        {history.map((entry, index) => {
          const config = statusConfig[entry.toStatus] || statusConfig.initiated;
          return (
            <div key={entry._id} className="flex gap-4 mb-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full mt-1 ${config.dot}`} />
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-1" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-gray-800">
                  {entry.fromStatus
                    ? `${entry.fromStatus} → ${entry.toStatus}`
                    : `Created as ${entry.toStatus}`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(entry.changedAt).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-400">
                  by {entry.triggeredBy}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}