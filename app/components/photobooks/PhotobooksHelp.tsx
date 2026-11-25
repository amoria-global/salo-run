'use client';

import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { pbCopy } from '@/lib/photobookCopy';

/** The web copy of the mobile Help article "Photobooks": sources, what needs buying, one photographer, extras, review. */
export default function PhotobooksHelp() {
  const { t, language } = useLanguage();
  // The body is only in the page while the panel is open: a closed <details> still keeps its text in the layout tree.
  const [open, setOpen] = useState(false);
  return (
    <details className="pbk-help" onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary><CircleHelp size={15} aria-hidden /> {pbCopy(language, 'help_title')}</summary>
      {open ? <div className="pbk-help-body">
        <p>{t('A photobook is a selection of your favourite photos. You choose them, send the book to the photographer who took them, and they tidy it up and send it back for you to review.')}</p>
        <p>{t('Where the photos can come from:')}</p>
        <ul>
          <li>{t('Event albums: the albums from your events.')}</li>
          <li>{t('Free albums you have opened with your email.')}</li>
          <li>{t('Purchased photos: only the photos you bought from a paid album.')}</li>
          <li>{t('Content albums: photos that are free to view, or priced ones once you have bought them.')}</li>
          <li>{t('Your own albums, if you are a photographer.')}</li>
        </ul>
        <p>{t('Paid and priced content photos you have not bought are never shown in the picker and can never be added. A photobook does not give anyone access to a photo they did not buy.')}</p>
        <p>{t("One photographer per book: every photo in a book must come from the same photographer, because the book is sent to them. Albums from another photographer switch off once you have chosen a photo.")}</p>
        <p>{t("Extras (event books only): an event comes with a number of free photos. Photos beyond that are charged at the photographer's price per extra photo, and you pay before you review the finished book. Books made from free, purchased or content albums never have extras.")}</p>
        <p>{t("Review: when the photographer sends the book back it shows as Ready to review. Accept it to finish. For an event book, accepting also releases the event's final payment to the photographer. Or choose Request changes, write what should change, and the book goes back to them. If the photographer closes a book instead, it shows as Closed by photographer.")}</p>
      </div> : null}
    </details>
  );
}
