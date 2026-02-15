export default function StatCard({ label, value, icon: Icon, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-600/10 text-primary-500',
    green: 'bg-green-600/10 text-green-500',
    blue: 'bg-blue-600/10 text-blue-500',
    yellow: 'bg-yellow-600/10 text-yellow-500',
    purple: 'bg-purple-600/10 text-purple-500',
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-dark-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-dark-100">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.primary}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
