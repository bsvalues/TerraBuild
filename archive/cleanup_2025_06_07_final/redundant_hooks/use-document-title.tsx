import { useEffect } from 'react';

/**
 * A custom hook to update the document title
 * @param title - The title to set for the document
 * @param options - Optional configuration
 * @param options.siteName - The site name to append after the title separator
 * @param options.separator - The separator to use between title and site name
 */
export const useDocumentTitle = (
  title: string,
  options: { siteName?: string; separator?: string } = {}
) => {
  const { siteName = 'BCBS', separator = ' | ' } = options;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title + (siteName ? separator + siteName : '');

    return () => {
      document.title = previousTitle;
    };
  }, [title, siteName, separator]);
};

export default useDocumentTitle;