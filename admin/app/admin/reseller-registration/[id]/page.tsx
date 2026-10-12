import LeadSubmissionDetail from "@/src/components/Admin/LeadSubmissionDetail";
export default async function Page({params}:{params:Promise<{id:string}>}){ const {id}=await params; return <LeadSubmissionDetail kind="reseller-registration" id={id}/>; }
