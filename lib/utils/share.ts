/**
 * Share a post using Web Share API or copy to clipboard as fallback
 */
export async function sharePost(postId: string, postTitle: string): Promise<boolean> {
  const url = `${window.location.origin}/post/${postId}`;
  const text = postTitle;

  // Check if Web Share API is supported (mostly on mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: text,
        url: url,
      });
      return true;
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    alert('คัดลอกลิงก์โพสต์แล้ว!\n\n' + url);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);

    // Last resort: Show URL in prompt
    prompt('คัดลอกลิงก์นี้:', url);
    return false;
  }
}
