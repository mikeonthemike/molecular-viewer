export interface EmbedParams {
  embed: boolean;
  tourId: string | null;
  structureId: string | null;
}

/** Parse embed-related URL search params for iframe / minimal chrome mode */
export function parseEmbedParams(search = window.location.search): EmbedParams {
  const params = new URLSearchParams(search);
  const embed = params.get('embed') === 'true';
  const tourId = params.get('tour')?.trim() || null;
  const structureId = params.get('s')?.trim().toUpperCase() || null;

  return { embed, tourId, structureId };
}
