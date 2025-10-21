import { ReviewDetail } from "@/components/doctor/review-detail"

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  return <ReviewDetail submissionId={params.id} />
}

