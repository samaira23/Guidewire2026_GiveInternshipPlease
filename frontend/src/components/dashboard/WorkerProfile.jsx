export default function WorkerProfile({ profile }) {
  const name = profile?.name || 'Raj Kumar';
  const occupation = profile?.occupation || 'Delivery Partner';
  const zone = profile?.zone || 'Chennai - Medium Risk';

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-blue-400 font-semibold mb-2">Worker Profile</h2>
      <p>Name: {name}</p>
      <p>Occupation: {occupation}</p>
      <p>Zone: {zone}</p>
    </div>
  );
}