import { getAllNotifications, groupNotificationsByMonth } from "@/services/notification";
import { parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createTranslator } from "next-intl";
import { BellRing } from "lucide-react";
import { NotificationsClientWrapper } from "@/components/notifications/notifications-wrapper";

const parseMonthYear = (monthYear: string): Date => {
  try {
    return parse(monthYear, 'MMMM yyyy', new Date(), { locale: ptBR });
  } catch {
    return new Date(0);
  }
};

export default async function NotificationsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const messages = (await import(`../../../../../messages/${locale}.json`)).default;
  const t = createTranslator({ locale, messages });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BellRing className="h-7 w-7 text-primary" /> {t("notifications.pageTitle")}
        </h1>
      </div>

      {/* Renderiza um componente Client que buscará dados do usuário logado */}
      <NotificationsClientWrapper />
    </div>
  );
}
