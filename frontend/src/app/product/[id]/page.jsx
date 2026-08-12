import { redirect } from "next/navigation";


export default function ProductAliasPage({ params }) {
  redirect(`/shop/${params.id}`);
}
