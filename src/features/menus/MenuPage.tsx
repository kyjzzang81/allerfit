import { useParams } from "react-router-dom";
import { AppTopBar } from "../../components/layout/AppTopBar";
import { MenuDetailContent } from "./MenuDetailContent";

export function MenuPage() {
  const { menuSlug } = useParams();

  return (
    <section className="page menu-detail-page">
      <AppTopBar showBack action="share" />
      <MenuDetailContent menuSlug={menuSlug} />
    </section>
  );
}
