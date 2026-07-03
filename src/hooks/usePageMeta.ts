import { useEffect } from "react";
import {
  applyPageMeta,
  PageMetaOptions,
  resetPageMeta,
} from "../utils/pageMeta";

export function usePageMeta(options: PageMetaOptions) {
  const { title, description, canonicalPath, jsonLd, noIndex } = options;
  const jsonLdSerialized = jsonLd ? JSON.stringify(jsonLd) : undefined;

  useEffect(() => {
    applyPageMeta({
      title,
      description,
      canonicalPath,
      jsonLd: jsonLdSerialized ? JSON.parse(jsonLdSerialized) : undefined,
      noIndex,
    });
    return resetPageMeta;
  }, [title, description, canonicalPath, jsonLdSerialized, noIndex]);
}
