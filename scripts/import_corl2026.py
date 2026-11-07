"""Import the preserved CoRL preview's public summaries into the survey."""
import argparse
import copy
import json
from pathlib import Path

COHORT = 'corl-2026-full-scan'
FIELDS = 'compute cpu gpu memory software resources ipc timing lifecycle recovery readiness placement recording buffering replay provenance limitations'.split()
PUBLIC_FIELDS = set(FIELDS + 'id paperId name org labName country year url repo reviewed cohort deploymentClass horizon sources sourceIds fieldRefs fieldEvidence missingFields screening identityNote'.split())
SOURCE_FIELDS = {'id', 'url', 'title', 'evidence'}
MEMBER_FIELDS = {'id', 'basis', 'sources', 'evidence', 'fields'}
ROOT = Path(__file__).resolve().parents[1]


def import_preview(survey, preview):
    """Append public records and source-mention memberships, preserving existing data."""
    result = copy.deepcopy(survey)
    records = preview['deepSurvey']['projects']
    existing = {p['id']: p for p in result['deepSurvey']['projects']}
    other_ids = {p['id'] for p in result['profiles']} | {r['p']['id'] for r in result['companySurvey']['rows']}
    sources = {source['id']: source for source in result['sources']}
    for original in records:
        record = {key: value for key, value in original.items() if key in PUBLIC_FIELDS}
        assert record['cohort'] == COHORT
        assert record['screening']['decision'] == 'include'
        assert not other_ids.intersection([record['id']])
        record['sources'] = [{key: value for key, value in source.items() if key in SOURCE_FIELDS}
                             for source in record['sources']]
        known = {source['id'] for source in record['sources']}
        for field in FIELDS:
            assert field in record and record[field]
            assert set(record['fieldRefs'][field]) <= known
            if record[field] == '-':
                assert record['fieldEvidence'][field] == 'missing' and not record['fieldRefs'][field]
            else:
                assert record['fieldRefs'][field]
        if record['id'] in existing:
            assert existing[record['id']] == record, f"Conflicting record: {record['id']}"
        else:
            result['deepSurvey']['projects'].append(record)
            existing[record['id']] = record
        for source in record['sources']:
            if source['id'] in sources:
                assert sources[source['id']] == source, f"Conflicting source: {source['id']}"
            else:
                result['sources'].append(source)
                sources[source['id']] = source
    new_ids = {record['id'] for record in records}
    labels = {label['id']: label for label in result['practiceLabels']}
    for incoming in preview['practiceLabels']:
        if incoming['id'] not in labels:
            labels[incoming['id']] = {key: value for key, value in incoming.items() if key != 'members'}
            labels[incoming['id']]['members'] = []
            result['practiceLabels'].append(labels[incoming['id']])
        label = labels[incoming['id']]
        for item in incoming['members']:
            member = {key: value for key, value in item.items() if key in MEMBER_FIELDS}
            assert member['id'] in new_ids and member['basis'] == 'mention'
            assert member['sources'] and set(member['sources']) <= sources.keys()
            if member not in label['members']:
                assert not any(old['id'] == member['id'] for old in label['members'])
                label['members'].append(member)
    result['labelMethod']['automaticMemberships'] = sum(
        member['basis'] == 'mention' for label in result['practiceLabels'] for member in label['members'])
    result['reviewed'] = max(result['reviewed'], preview['reviewed'])
    result.setdefault('researchCohorts', {})[COHORT] = {
        'reviewed': preview['reviewed'], 'records': len(records),
        'methodology': 'docs/corl-2026.md',
        'inventory': 'https://www.corl.org/program/accepted-papers',
    }
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('preview', type=Path, help='Preserved preview/full/lab-research.json')
    parser.add_argument('--survey', type=Path, default=ROOT / 'lab-research.json')
    args = parser.parse_args()
    result = import_preview(json.loads(args.survey.read_text()), json.loads(args.preview.read_text()))
    args.survey.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    print(f"Imported {result['researchCohorts'][COHORT]['records']} CoRL records")
