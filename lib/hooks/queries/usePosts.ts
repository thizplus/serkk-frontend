import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import postService from '@/lib/services/api/post.service';
import type { GetPostsParams, CreatePostRequest, UpdatePostRequest, CreateCrosspostRequest } from '@/lib/types/request';
import type { Post } from '@/lib/types/models';
import { toast } from 'sonner';

/**
 * Query Keys - ใช้สำหรับ identify queries
 */
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (params?: GetPostsParams) => [...postKeys.lists(), params] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  byAuthor: (userId: string, params?: GetPostsParams) =>
    [...postKeys.all, 'author', userId, params] as const,
  byTag: (tagName: string, params?: GetPostsParams) =>
    [...postKeys.all, 'tag', tagName, params] as const,
  feed: (params?: GetPostsParams) => [...postKeys.all, 'feed', params] as const,
};

/**
 * ดึงรายการโพสต์ทั้งหมด
 */
export function usePosts(params?: GetPostsParams) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: async () => {
      const response = await postService.list(params);
      if (!response.success) throw new Error('Failed to fetch posts');
      return response.data?.posts || [];
    },
  });
}

/**
 * ดึงโพสต์ตาม ID
 */
export function usePost(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const response = await postService.getById(id);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch post');
      }
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!id, // ทำงานเมื่อมี id เท่านั้น
  });
}

/**
 * ดึงโพสต์ของ author คนใดคนหนึ่ง
 */
export function useUserPosts(
  userId: string,
  options?: {
    params?: GetPostsParams;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: postKeys.byAuthor(userId, options?.params),
    queryFn: async () => {
      const response = await postService.getByAuthor(userId, options?.params);
      if (!response.success) throw new Error('Failed to fetch user posts');
      return response.data?.posts || [];
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
  });
}

/**
 * ดึงโพสต์ที่มี tag ระบุ
 */
export function usePostsByTag(tagName: string, params?: GetPostsParams) {
  return useQuery({
    queryKey: postKeys.byTag(tagName, params),
    queryFn: async () => {
      const response = await postService.getByTag(tagName, params);
      if (!response.success) throw new Error('Failed to fetch posts by tag');
      return response.data?.posts || [];
    },
    enabled: !!tagName,
  });
}

/**
 * ดึง personalized feed
 */
export function useFeed(params?: GetPostsParams) {
  return useQuery({
    queryKey: postKeys.feed(params),
    queryFn: async () => {
      const response = await postService.getFeed(params);
      if (!response.success) throw new Error('Failed to fetch feed');
      return response.data?.posts || [];
    },
  });
}

/**
 * สร้างโพสต์ใหม่
 */
export function useCreatePost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostRequest) => {
      console.log('📝 Creating post:', {
        title: data.title,
        hasMedia: !!data.mediaIds?.length,
        hasTags: !!data.tags?.length,
      });

      const response = await postService.create(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create post');
      }
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Post created successfully:', { id: data.id, title: data.title });

      // Invalidate และ refetch posts queries
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
      queryClient.invalidateQueries({ queryKey: postKeys.byAuthor(data.author.id) });

      toast.success('สร้างโพสต์สำเร็จ!');

      // Navigate to the new post
      router.push(`/post/${data.id}`);
    },
    onError: (error: Error) => {
      console.error('❌ Create post error:', error);
      toast.error(error.message || 'ไม่สามารถสร้างโพสต์ได้');
    },
  });
}

/**
 * อัปเดทโพสต์
 */
export function useUpdatePost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePostRequest }) => {
      console.log('📝 Updating post:', id);

      const response = await postService.update(id, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update post');
      }
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Post updated successfully:', data.id);

      // Update specific post in cache
      queryClient.setQueryData(postKeys.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.byAuthor(data.author.id) });

      toast.success('อัปเดทโพสต์สำเร็จ!');

      // Navigate to the updated post
      router.push(`/post/${data.id}`);
    },
    onError: (error: Error) => {
      console.error('❌ Update post error:', error);
      toast.error(error.message || 'ไม่สามารถอัปเดทโพสต์ได้');
    },
  });
}

/**
 * ลบโพสต์
 */
export function useDeletePost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Deleting post:', id);

      const response = await postService.delete(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete post');
      }
      return id;
    },
    onSuccess: (id) => {
      console.log('✅ Post deleted successfully:', id);

      // Remove from cache
      queryClient.removeQueries({ queryKey: postKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });

      toast.success('ลบโพสต์สำเร็จ!');

      // Navigate to home
      router.push('/');
    },
    onError: (error: Error) => {
      console.error('❌ Delete post error:', error);
      toast.error(error.message || 'ไม่สามารถลบโพสต์ได้');
    },
  });
}

/**
 * สร้าง crosspost (แชร์โพสต์)
 */
export function useCreateCrosspost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourcePostId,
      data,
    }: {
      sourcePostId: string;
      data: CreateCrosspostRequest;
    }) => {
      console.log('🔄 Creating crosspost from:', sourcePostId);

      const response = await postService.createCrosspost(sourcePostId, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create crosspost');
      }
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Crosspost created successfully:', {
        id: data.id,
        sourcePostId: data.sourcePost?.id,
      });

      // Invalidate posts queries
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
      queryClient.invalidateQueries({ queryKey: postKeys.byAuthor(data.author.id) });

      toast.success('แชร์โพสต์สำเร็จ!');

      // Navigate to the crosspost
      router.push(`/post/${data.id}`);
    },
    onError: (error: Error) => {
      console.error('❌ Create crosspost error:', error);
      toast.error(error.message || 'ไม่สามารถแชร์โพสต์ได้');
    },
  });
}
