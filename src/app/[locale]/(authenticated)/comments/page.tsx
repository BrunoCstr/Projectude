import { CommentList } from '@/components/comments/comment-list'; // Import the new list component

export default function CommentsPage() {
  // The logic for fetching, filtering, and displaying comments,
  // along with handling comment creation, updates, and archiving,
  // is now encapsulated within the CommentList component.
  return (
    <div className="flex flex-col gap-8">
      {/* Header, Filter Panel and Tabs are now handled within CommentList */}
      <CommentList />
    </div>
  );
}
