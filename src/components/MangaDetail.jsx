import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import Spinner from "./Spinner";

const MangaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMangaDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const resp = await axios.get(`/api/manga/${id}`, {
          params: {
            "includes[]": [
              "cover_art",
              "author",
              "artist",
              "creator",
              "tag",
              "manga",
            ],
          },
        });

        setManga(resp.data.data);
      } catch (err) {
        console.error("Error fetching manga details:", err);
        setError("Failed to load manga details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMangaDetails();
    }
  }, [id]);

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

  const getDescription = (attributes) => {
    if (!attributes?.description) return "No description available.";
    const desc = attributes.description;
    return (
      desc.en ||
      desc["en-us"] ||
      desc.ja ||
      desc["ja-ro"] ||
      Object.values(desc)[0] ||
      "No description available."
    );
  };

  const getCoverUrl = (manga) => {
    const coverRel = manga.relationships?.find(
      (rel) => rel.type === "cover_art",
    );
    const fileName = coverRel?.attributes?.fileName;
    if (!fileName) return null;
    const base = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
    return `${base}.512.jpg`;
  };

  const getAuthors = (manga) => {
    const authors = manga.relationships
      ?.filter((rel) => ["author", "artist", "creator"].includes(rel.type))
      .map((rel) => rel.attributes?.name || "Unknown")
      .filter(Boolean);
    return authors && authors.length > 0 ? authors.join(", ") : "Unknown";
  };

  const getTags = (attributes) => {
    return attributes?.tags || [];
  };

  const getStatus = (attributes) => {
    const status = attributes?.status || "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return <Spinner />;
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-transparent p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="animate-fade-in-up mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{error || "Manga not found"}</span>
            <button
              onClick={() => navigate(-1)}
              className="rounded-md bg-red-600 px-3 py-1 text-white transition-all duration-300 hover:scale-105 hover:bg-red-700 active:scale-95"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { attributes } = manga;
  const title = buildTitle(attributes);
  const description = getDescription(attributes);
  const coverUrl = getCoverUrl(manga);
  const authors = getAuthors(manga);
  const tags = getTags(attributes);
  const status = getStatus(attributes);
  const year = attributes?.year || "Unknown";
  const contentRating = attributes?.contentRating || "";
  const originalLanguage = attributes?.originalLanguage || "";
  const publicationDemographic = attributes?.publicationDemographic || "";

  return (
    <div className="animate-fade-in min-h-screen bg-transparent p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-light-200 group animate-fade-in mb-6 flex items-center gap-2 transition-all duration-300 hover:translate-x-[-4px] hover:scale-105 hover:text-white active:scale-95"
        >
          <svg
            className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Feed
        </button>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-[300px_1fr] lg:grid-cols-[400px_1fr]">
          {/* Cover Image */}
          <div className="animate-slide-in-left flex flex-col">
            <div className="sticky top-6">
              <div className="border-light-100/20 group/cover overflow-hidden rounded-xl border-2 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-500/30">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={title}
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover/cover:scale-110"
                  />
                ) : (
                  <div className="aspect-[2/3] w-full animate-pulse bg-gray-200" />
                )}
              </div>

              {/* External Link */}
              <a
                href={`https://mangadex.org/title/${id}`}
                target="_blank"
                rel="noreferrer"
                className="bg-light-100/10 hover:bg-light-100/20 mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-white transition"
              >
                <span>View on MangaDex</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Details */}
          <div className="animate-slide-in-right flex flex-col gap-6">
            {/* Title */}
            <div>
              <h1 className="hover:text-light-100 mb-2 text-4xl font-bold text-white transition-all duration-300 sm:text-5xl">
                {title}
              </h1>
              {attributes?.altTitles && attributes.altTitles.length > 0 && (
                <p className="text-light-200">
                  {attributes.altTitles
                    .map((alt) => Object.values(alt)[0])
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(" • ")}
                </p>
              )}
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-3">
              {status && (
                <span className="bg-light-100/10 hover:bg-light-100/20 animate-fade-in-scale cursor-default rounded-lg px-3 py-1.5 text-sm text-white transition-all duration-300 hover:scale-110">
                  {status}
                </span>
              )}
              {year !== "Unknown" && (
                <span className="bg-light-100/10 hover:bg-light-100/20 animate-fade-in-scale cursor-default rounded-lg px-3 py-1.5 text-sm text-white transition-all duration-300 hover:scale-110">
                  {year}
                </span>
              )}
              {contentRating && (
                <span className="bg-light-100/10 hover:bg-light-100/20 animate-fade-in-scale cursor-default rounded-lg px-3 py-1.5 text-sm text-white capitalize transition-all duration-300 hover:scale-110">
                  {contentRating}
                </span>
              )}
              {publicationDemographic && (
                <span className="bg-light-100/10 hover:bg-light-100/20 animate-fade-in-scale cursor-default rounded-lg px-3 py-1.5 text-sm text-white capitalize transition-all duration-300 hover:scale-110">
                  {publicationDemographic}
                </span>
              )}
              {originalLanguage && (
                <span className="bg-light-100/10 hover:bg-light-100/20 animate-fade-in-scale cursor-default rounded-lg px-3 py-1.5 text-sm text-white uppercase transition-all duration-300 hover:scale-110">
                  {originalLanguage}
                </span>
              )}
            </div>

            {/* Authors */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Authors</h3>
              <p className="text-light-200">{authors}</p>
            </div>

            {/* Description */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Description
              </h3>
              <p className="leading-relaxed whitespace-pre-wrap text-gray-300">
                {description}
              </p>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-white">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => {
                    const tagName =
                      tag.attributes?.name?.en ||
                      tag.attributes?.name?.["en-us"] ||
                      Object.values(tag.attributes?.name || {})[0] ||
                      "Unknown";
                    return (
                      <span
                        key={tag.id}
                        className="bg-light-100/10 text-light-200 hover:bg-light-100/20 animate-fade-in-scale cursor-default rounded-lg px-3 py-1.5 text-sm transition-all duration-300 hover:scale-110"
                        style={{
                          animationDelay: `${index * 0.05}s`,
                          opacity: 0,
                          animationFillMode: "forwards",
                        }}
                      >
                        {tagName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              {attributes?.lastChapter && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-400">
                    Last Chapter
                  </h4>
                  <p className="text-white">{attributes.lastChapter}</p>
                </div>
              )}
              {attributes?.lastVolume && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-400">
                    Last Volume
                  </h4>
                  <p className="text-white">{attributes.lastVolume}</p>
                </div>
              )}
              {attributes?.createdAt && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-400">
                    Created
                  </h4>
                  <p className="text-white">
                    {new Date(attributes.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {attributes?.updatedAt && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-400">
                    Updated
                  </h4>
                  <p className="text-white">
                    {new Date(attributes.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaDetail;
