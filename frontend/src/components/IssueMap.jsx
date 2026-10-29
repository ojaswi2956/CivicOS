import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
    CircleMarker,
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import {
    formatLocaleDate,
    translateStatus,
    useLocale,
} from "../i18n/LocaleContext";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [30.3398, 76.3869];
const EMPTY_ISSUES = [];
const STATUS_COLORS = {
    REPORTED: "#e5a33b",
    VERIFIED: "#3988d8",
    ASSIGNED: "#8c63d9",
    IN_PROGRESS: "#e18a42",
    RESOLVED: "#279b75",
    CLOSED: "#64748b",
};

const selectedLocationIcon = L.divIcon({
    className: "issue-map-selected-icon",
    html: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

function getCoordinates(latitude, longitude) {
    if (latitude === null || latitude === undefined || latitude === "" ||
        longitude === null || longitude === undefined || longitude === "") {
        return null;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
    ) {
        return null;
    }

    return [lat, lng];
}

function MapClickHandler({ onLocationSelect }) {
    useMapEvents({
        click(event) {
            onLocationSelect?.([
                event.latlng.lat,
                event.latlng.lng,
            ]);
        },
    });

    return null;
}

function MapViewport({ center }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);

    return null;
}

export default function IssueMap({
    issues = EMPTY_ISSUES,
    selectedLocation = null,
    onLocationSelect,
    label,
}) {
    const { locale, t } = useLocale();
    const markers = useMemo(
        () =>
            issues
                .map((issue) => ({
                    ...issue,
                    coordinates: getCoordinates(issue.latitude, issue.longitude),
                }))
                .filter((issue) => issue.coordinates),
        [issues]
    );
    const center = selectedLocation ||
        markers[0]?.coordinates ||
        DEFAULT_CENTER;

    return (
        <div
            className={`issue-map${onLocationSelect ? " issue-map-picker" : ""}`}
            role="region"
            aria-label={label || t("Community issue locations")}
        >
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom
                className="issue-map-canvas"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewport center={center} />
                {onLocationSelect && (
                    <MapClickHandler onLocationSelect={onLocationSelect} />
                )}

                {markers.map((issue) => {
                    const color = STATUS_COLORS[issue.status] || "#5367d9";

                    return (
                        <CircleMarker
                            key={issue.id}
                            center={issue.coordinates}
                            radius={8}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.88,
                                weight: 2,
                            }}
                        >
                            <Popup>
                                <div className="issue-map-popup">
                                    <strong>{issue.title || t("Untitled issue")}</strong>
                                    <span>
                                        {translateStatus(locale, issue.category)}
                                    </span>
                                    <span className="issue-map-popup-status">
                                        {translateStatus(locale, issue.status)}
                                    </span>
                                    {issue.createdAt && (
                                        <span>
                                            {formatLocaleDate(issue.createdAt, locale, {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                    )}
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                {selectedLocation && (
                    <Marker
                        position={selectedLocation}
                        icon={selectedLocationIcon}
                    >
                        <Popup>{t("Selected location")}</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
