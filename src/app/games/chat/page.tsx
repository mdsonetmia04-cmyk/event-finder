import { redirect } from "next/navigation";

/* Game Chat used to live here; it now stays open on the Gaming Zone page
   itself, so old links land there. */
export default function GamesChatRedirect() {
  redirect("/games");
}
