import ScanFlow from './ScanFlow'

export default async function ScanPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = await params
  return <ScanFlow vehicleId={vehicleId} />
}
