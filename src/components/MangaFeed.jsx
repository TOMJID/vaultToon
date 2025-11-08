import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router";
import axios from "axios";
import Spinner from "./Spinner";

const LIMIT = 30; // keep limit and offset in sync

const LatestMangaFeed = ({ searchTerm = "" }) => {
  const [mangaList, setMangaList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [previousMangaCount, setPreviousMangaCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const observerRef = useRef(null);
  const cancelRef = useRef(null);

  const buildTitle = (attributes) => {
    if (!attributes?.title) return "Untitled";
    const t = attributes.title;
    return (
      t.en ||
      t["en-us"] ||
      t.ja ||
      t["ja-ro"] ||
      Object.values(t)[0] ||
      attributes?.altTitles?.[0]?.en ||
      "Untitled"
    );
  };

  const getCoverUrl = (manga) => {
    const coverRel = manga.relationships?.find(
      (rel) => rel.type === "cover_art",
    );
    const fileName = coverRel?.attributes?.fileName;
    if (!fileName) return null;
    const base = `/api/covers/${manga.id}/${fileName}`;
    return {
      src: `${base}.256.jpg`,
      srcSet: `${base}.256.jpg 1x, ${base}.512.jpg 2x`,
    };
  };

  const mergeUniqueById = (prev, next) => {
    const map = new Map(prev.map((m) => [m.id, m]));
    for (const m of next) map.set(m.id, m);
    return Array.from(map.values());
  };

  const fetchLatestManga = useCallback(
    async (pageNum) => {
      setLoading(true);
      setError("");

      // cancel any in-flight request
      if (cancelRef.current) {
        cancelRef.current.cancel("New request started");
      }
      cancelRef.current = axios.CancelToken.source();

      try {
        const params = {
          limit: LIMIT,
          offset: (pageNum - 1) * LIMIT,
          "includes[]": ["cover_art"],
        };

        // If there's a search term, use search API, otherwise use latest feed
        if (searchTerm.trim()) {
          params.title = searchTerm.trim();
          params["order[relevance]"] = "desc";
        } else {
          params["order[latestUploadedChapter]"] = "desc";
        }

        const resp = await axios.get("/api/manga", {
          params,
          cancelToken: cancelRef.current.token,
        });

        // If successful, reset retry count
        setRetryCount(0);

        const api = resp.data || {};
        const newManga = api.data || [];
        const apiTotal = typeof api.total === "number" ? api.total : null;

        if (apiTotal !== null) setTotal(apiTotal);

        setMangaList((prev) => {
          const isFirstPage = pageNum === 1;
          if (isFirstPage) {
            setIsInitialLoad(true);
            setPreviousMangaCount(0);
            return newManga;
          } else {
            setIsInitialLoad(false);
            setPreviousMangaCount(prev.length);
            return mergeUniqueById(prev, newManga);
          }
        });

        if (apiTotal !== null) {
          const fetchedSoFar = (pageNum - 1) * LIMIT + newManga.length;
          setHasMore(fetchedSoFar < apiTotal);
        } else {
          setHasMore(newManga.length >= LIMIT);
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Error fetching MangaDex feed:", err);
          setError("Failed to load manga feed.");
          setRetryCount((prev) => prev + 1);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, setRetryCount],
  );

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
    setMangaList([]);
    setIsInitialLoad(true);
    setPreviousMangaCount(0);
    setRetryCount(0); // Reset retry count on new search
  }, [searchTerm]);

  // Fetch when page or search term changes
  useEffect(() => {
    fetchLatestManga(page);
    return () => {
      if (cancelRef.current) cancelRef.current.cancel("Component unmounted");
    };
  }, [page, fetchLatestManga]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      {
        rootMargin: "800px 0px", // prefetch before reaching the bottom
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.unobserve(sentinel);
  }, [hasMore, loading]);

  const MAX_RETRIES = 3;

  const retry = () => {
    if (retryCount < MAX_RETRIES) {
      setError(""); // Clear previous error message
      // Add a delay before retrying
      setTimeout(() => {
        fetchLatestManga(page);
      }, 2000); // 2-second delay
      setError(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
    } else {
      setError(
        "Failed to load manga feed after multiple attempts. Please try again later.",
      );
    }
  };

  return (
    <section
      className="min-h-screen p-4 sm:p-6"
      style={{ background: "transparent" }}
    >
      <header className="animate-fade-in-down mb-5 flex flex-row items-center justify-center gap-2 sm:mb-6">
        <div>
          <h2 className="font- text-center text-3xl font-bold transition-all duration-300">
            {searchTerm.trim()
              ? `Search Results for "${searchTerm}"`
              : "Manga feed"}
          </h2>
          <p className="text-center text-sm text-gray-500 transition-all duration-300 sm:text-left">
            {total !== null && (
              <>
                {searchTerm.trim() ? "Found" : "current loaded"}{" "}
                {mangaList.length} out of {total}
              </>
            )}
          </p>
        </div>
      </header>

      {error && (
        <div className="animate-fade-in-up mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={retry}
            className="rounded-md bg-red-600 px-3 py-1 text-white transition-all duration-300 hover:scale-105 hover:bg-red-700 active:scale-95"
          >
            Retry
          </button>
        </div>
      )}

      {loading && mangaList.length === 0 ? (
        <Spinner />
      ) : (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          aria-live="polite"
        >
          {mangaList.map((manga, index) => {
            const { id, attributes } = manga;
            const cover = getCoverUrl(manga);
            const title = buildTitle(attributes);
            const year = attributes?.year || "Unknown";
            const status = attributes?.status || "";
            const contentRating = attributes?.contentRating || "";

            // Only animate if it's initial load or if this is a new item (index >= previousMangaCount)
            const isNewItem = index >= previousMangaCount;
            const shouldAnimate = isInitialLoad || isNewItem;

            // For initial load, use staggered animation. For new items, use quick fade-in
            const animationDelay = isInitialLoad
              ? `${Math.min(index * 0.05, 1)}s`
              : isNewItem
                ? `${(index - previousMangaCount) * 0.03}s`
                : "0s";
            const animationDuration = isInitialLoad ? "0.5s" : "0.3s";
            const initialOpacity = shouldAnimate ? 0 : 1;

            return (
              <Link
                key={id}
                to={`/manga/${id}`}
                className="group relative block overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20"
                style={{
                  animation: shouldAnimate
                    ? `fadeInScale ${animationDuration} ease-out forwards`
                    : "none",
                  animationDelay: animationDelay,
                  opacity: initialOpacity,
                }}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100">
                  {cover ? (
                    <img
                      src={cover.src}
                      srcSet={cover.srcSet}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      alt={title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-gray-200" />
                  )}

                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Shimmer effect on hover */}
                  <div className="animate-shimmer pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Title + meta */}
                  <div className="absolute inset-x-0 bottom-0 transform p-2 text-white transition-transform duration-300 group-hover:translate-y-[-4px]">
                    <h3 className="group-hover:text-light-100 line-clamp-2 text-sm font-semibold drop-shadow-md transition-all duration-300">
                      {title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] opacity-90 transition-opacity duration-300 group-hover:opacity-100">
                      <span>{year}</span>
                      {status && (
                        <span className="rounded bg-white/15 px-1.5 py-0.5 transition-all duration-300 group-hover:scale-105 group-hover:bg-white/25">
                          {status}
                        </span>
                      )}
                      {contentRating && (
                        <span className="rounded bg-white/15 px-1.5 py-0.5 transition-all duration-300 group-hover:scale-105 group-hover:bg-white/25">
                          {contentRating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover CTA */}
                  <div className="animate-fade-in pointer-events-none absolute inset-0 hidden items-center justify-center backdrop-blur-[2px] group-hover:flex">
                    <div className="transform rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      View Details
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Enhanced Skeletons while loading */}
          {loading &&
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="group animate-fade-in-scale relative block overflow-hidden rounded-xl border bg-white shadow-sm"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-200">
                  <div className="animate-shimmer h-full w-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]" />
                  {/* Gradient overlay skeleton */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent opacity-90" />
                  {/* Title skeleton */}
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-white/30" />
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-12 animate-pulse rounded bg-white/20" />
                      <div className="h-3 w-16 animate-pulse rounded bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Status + sentinel */}
      <div className="py-4">
        {loading && mangaList.length > 0 && (
          <div className="animate-fade-in flex items-center justify-center py-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-dashed border-purple-500/30" />
                <div
                  className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-purple-500 border-r-blue-500"
                  style={{ animationDuration: "0.8s" }}
                />
              </div>
              <p
                className="text-center text-sm text-gray-400"
                aria-live="assertive"
              >
                Loading more manga…
              </p>
            </div>
          </div>
        )}
        {!loading && !hasMore && mangaList.length > 0 && (
          <div className="animate-fade-in flex flex-col items-center gap-2 py-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg
                className="h-5 w-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>You're all caught up!</span>
            </div>
            <p className="text-xs text-gray-500">
              Found {mangaList.length}{" "}
              {mangaList.length === 1 ? "manga" : "manga"}
            </p>
          </div>
        )}
        <div ref={observerRef} className="h-2 w-full" />
      </div>
    </section>
  );
};

export default LatestMangaFeed;
