import { PatientRecordDetail } from "@/components/patient/health-record-detail"

export default function PatientRecordDetailPage({ params }: { params: { id: string } }) {
  return <PatientRecordDetail submissionId={params.id} />
}
