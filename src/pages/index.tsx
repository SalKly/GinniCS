import { CompanyFormEntrance } from "../components/entrance/CompanyFormEntrance";
import { EditorPasswordProtection } from "../components/common/EditorPasswordProtection";

export default function Home() {
  return (
    <EditorPasswordProtection>
      <CompanyFormEntrance />
    </EditorPasswordProtection>
  );
}
