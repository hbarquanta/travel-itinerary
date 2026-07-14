-- Renames trips to short, evocative names and rewrites each description as
-- a plain hyphen-separated stop listing, mirroring the actual route on the
-- map exactly (confirmed against a live `select ... from trips join stops`
-- query on 2026-07-14, not the stale seed files, which had drifted out of
-- date in several places — e.g. the Ukraine trip's Chișinău/Bucharest leg
-- and the Oman trip's Muscat-Salalah-Muscat backtrack weren't in the seeds
-- at all).
--
-- Matched by the CURRENT (pre-rename) title, so this is safe to re-run —
-- an update just re-sets the same title/description, unlike the
-- INSERT-based seed files. If you rename a trip again after this runs,
-- re-running this file is a no-op for that row (title no longer matches).

update trips set
  title = 'Westbalkan II',
  description = 'Graz-Wildon-Šibenik-Dubrovnik-Herceg Novi-Kotor-Budva-Cetinje-Podgorica-Nikšić-Mostar-Sarajevo-Banja Luka-Wildon-Graz'
  where title = 'Balkans Road Trip';

update trips set
  title = 'Polska',
  description = 'Graz-Poznań-Łódź-Wrocław-Vienna-Graz'
  where title = 'Western Poland';

update trips set
  title = 'Transcaucasia',
  description = 'Vienna-Istanbul-Ankara-Kars-Batumi-Tbilisi-Yerevan-Vienna'
  where title = 'Turkey & the Caucasus';

update trips set
  title = 'Україна',
  description = 'Vienna-Lviv-Kyiv-Kharkiv-Odesa-Chișinău-Bucharest-Vienna'
  where title = 'Ukraine';

update trips set
  title = 'Turkestan',
  description = 'Vienna-Tbilisi-Baku-Aktau-Khiva-Bukhara-Samarkand-Tashkent-Vienna'
  where title = 'Caspian Crossing to Uzbekistan';

update trips set
  title = 'Persia',
  description = 'Vienna-Tbilisi-Baku-Isfahan-Shiraz-Tehran-Vienna'
  where title = 'Baku & Tehran';

update trips set
  title = 'Westbalkan III',
  description = 'Graz-Niš-Pristina-Skopje-Tirana-Budva-Dubrovnik-Split-Graz'
  where title = 'Balkans Road Trip II';

update trips set
  title = 'Bodensee',
  description = 'Vienna-Bregenz-Konstanz-St. Gallen-Zürich-Vienna'
  where title = 'Bodensee Loop';

update trips set
  description = 'Vienna-Muscat-Salalah-Muscat-Vienna'
  where title = 'Oman';

update trips set
  title = 'Transsiberia',
  description = 'Vienna-Moscow-Yekaterinburg-Novosibirsk-Irkutsk-Ulan-Ude-Ulaanbaatar-Beijing-Shanghai-Vienna'
  where title = 'Trans-Siberian to China';
