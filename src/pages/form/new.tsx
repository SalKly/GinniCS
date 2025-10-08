import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { BlueprintForm } from "../../components/blueprint/BlueprintForm";
import { EditorPasswordProtection } from "../../components/common/EditorPasswordProtection";

export default function NewFormPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    // Get company name from query params if provided
    if (router.query.company && typeof router.query.company === "string") {
      setCompanyName(decodeURIComponent(router.query.company));
    }
  }, [router.query]);

  return (
    <EditorPasswordProtection>
      <BlueprintForm mode="create" companyName={companyName} />
    </EditorPasswordProtection>
  );
}
