import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import Spinner from "./Spinner";

const LIMIT = 30; // keep limit and offset in sync

const LatestMangaFeed = () => {
  const [mangaList, setMangaList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(null);

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
    const base = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
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

  const fetchLatestManga = useCallback(async (pageNum) => {
    setLoading(true);
    setError("");

    // cancel any in-flight request
    if (cancelRef.current) {
      cancelRef.current.cancel("New request started");
    }
    cancelRef.current = axios.CancelToken.source();

    try {
      const resp = await axios.get("https://api.mangadex.org/manga", {
        params: {
          limit: LIMIT,
          offset: (pageNum - 1) * LIMIT,
          // "Latest" = recently updated series (newest uploaded chapter first)
          "order[latestUploadedChapter]": "desc",
          // If you meant newly created titles instead, use:
          // "order[createdAt]": "desc",
          // Include related cover art so we can build image URLs
          "includes[]": ["cover_art"],
          // Optional: content filter example
          // "contentRating[]": ["safe", "suggestive"],
        },
        cancelToken: cancelRef.current.token,
      });

      const api = resp.data || {};
      const newManga = api.data || [];
      const apiTotal = typeof api.total === "number" ? api.total : null;

      if (apiTotal !== null) setTotal(apiTotal);

      setMangaList((prev) =>
        pageNum === 1 ? newManga : mergeUniqueById(prev, newManga),
      );

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
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when page changes
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

  const retry = () => {
    setError("");
    fetchLatestManga(page);
  };

  return (
    <section className="min-h-screen p-4 sm:p-6">
      <header className="mb-5 flex flex-row items-center justify-center gap-2 sm:mb-6">
        <div>
          <h2 className="font- text-center text-3xl font-bold">Manga feed</h2>
          <p className="text-center text-sm text-gray-500 sm:text-left">
            {total !== null && (
              <>
                current loaded {mangaList.length} out of {total}
              </>
            )}
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={retry}
            className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700"
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
          {mangaList.map((manga) => {
            const { id, attributes } = manga;
            const cover = getCoverUrl(manga);
            const title = buildTitle(attributes);
            const year = attributes?.year || "Unknown";
            const status = attributes?.status || "";
            const contentRating = attributes?.contentRating || "";

            return (
              <a
                key={id}
                href={`https://mangadex.org/title/${id}`}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[2/3] w-full bg-gray-100">
                  {cover ? (
                    <img
                      src={cover.src}
                      srcSet={cover.srcSet}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      alt={title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-gray-200" />
                  )}

                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent opacity-90" />

                  {/* Title + meta */}
                  <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                    <h3 className="line-clamp-2 text-sm font-semibold drop-shadow-md">
                      {title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] opacity-90">
                      <span>{year}</span>
                      {status && (
                        <span className="rounded bg-white/15 px-1.5 py-0.5">
                          {status}
                        </span>
                      )}
                      {contentRating && (
                        <span className="rounded bg-white/15 px-1.5 py-0.5">
                          {contentRating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover CTA */}
                  <div className="pointer-events-none absolute inset-0 hidden items-center justify-center backdrop-blur-[2px] group-hover:flex"></div>
                </div>
              </a>
            );
          })}

          {/* Skeletons while loading */}
          {loading &&
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="overflow-hidden rounded-xl border bg-white"
              >
                <div className="aspect-[2/3] w-full animate-pulse bg-gray-200" />
                <div className="p-3">
                  <div className="mb-2 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Status + sentinel */}
      <div className="py-4">
        {loading && (
          <p
            className="text-center text-sm text-gray-500"
            aria-live="assertive"
          >
            Loading more manga…
          </p>
        )}
        {!loading && !hasMore && mangaList.length > 0 && (
          <p className="text-center text-sm text-gray-400">
            You're all caught up.
          </p>
        )}
        <div ref={observerRef} className="h-2 w-full" />
      </div>
    </section>
  );
};

export default LatestMangaFeed;
