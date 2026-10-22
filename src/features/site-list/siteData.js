const SLOTS = ['00', '15', '30', '45'];

export function validateSiteData(data) {
  if (!data || !Array.isArray(data.groups)) {
    throw new Error('sites.json must contain a groups array.');
  }

  data.groups.forEach((group) => {
    if (!group || typeof group.group !== 'string' || !Array.isArray(group.sites)) {
      throw new Error('Each site group must have a name and a sites array.');
    }
    group.sites.forEach((site) => {
      if (!site || typeof site.name !== 'string' || SLOTS.some((slot) => typeof site[slot] !== 'boolean')) {
        throw new Error(`Invalid site entry in group "${group.group}".`);
      }
    });
  });
  return data.groups;
}
