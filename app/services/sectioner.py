from dataclasses import dataclass


@dataclass(frozen=True)
class DocumentSection:
    section_id: int
    text: str
    start: int
    end: int


def split_into_sections(document: str) -> list[DocumentSection]:
    """Split on blank-line boundaries while preserving exact source offsets."""
    sections: list[DocumentSection] = []
    cursor = 0
    for chunk in document.split("\n\n"):
        start = document.find(chunk, cursor)
        if start < 0:
            continue
        end = start + len(chunk)
        if chunk.strip():
            sections.append(DocumentSection(len(sections) + 1, chunk, start, end))
        cursor = end + 2
    return sections
