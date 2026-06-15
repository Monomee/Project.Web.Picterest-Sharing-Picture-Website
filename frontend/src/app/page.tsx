export default function Home() {
  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-8 text-red-600">Pinterest Test Feed</h1>
      
      {/* Thử nghiệm lưới Grid so le cơ bản của Tailwind */}
      <div className="columns-2 md:columns-4 gap-4 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow h-40 flex items-center justify-center font-semibold">Ảnh Thấp</div>
        <div className="bg-white p-4 rounded-lg shadow h-80 flex items-center justify-center font-semibold text-blue-500">Ảnh Cao</div>
        <div className="bg-white p-4 rounded-lg shadow h-60 flex items-center justify-center font-semibold text-green-500">Ảnh Vừa</div>
        <div className="bg-white p-4 rounded-lg shadow h-96 flex items-center justify-center font-semibold text-purple-500">Ảnh Rất Cao</div>
      </div>
    </div>
  );
}