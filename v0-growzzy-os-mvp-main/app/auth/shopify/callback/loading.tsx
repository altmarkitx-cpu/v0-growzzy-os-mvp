export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Connecting to Shopify...</h2>
        <p className="text-gray-600">Please wait while we authenticate your store.</p>
      </div>
    </div>
  )
}
