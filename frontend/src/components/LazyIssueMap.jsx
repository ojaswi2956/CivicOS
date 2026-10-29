import { lazy, Suspense } from "react";
import { useLocale } from "../i18n/LocaleContext";

const IssueMap = lazy(() => import("./IssueMap"));

export default function LazyIssueMap(props) {
    const { t } = useLocale();
    const loadingClassName = props.onLocationSelect
        ? "issue-map-loading issue-map-loading-picker"
        : "issue-map-loading";

    return (
        <Suspense
            fallback={
                <div className={loadingClassName} role="status">
                    {t("Loading map...")}
                </div>
            }
        >
            <IssueMap {...props} />
        </Suspense>
    );
}
