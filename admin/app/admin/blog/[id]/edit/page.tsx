import BlogEditor from "@/src/components/Admin/BlogEditor";
export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BlogEditor blogId={id} />;
}
