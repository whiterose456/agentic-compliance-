from app.services.sectioner import split_into_sections


def test_sections_keep_exact_source_offsets():
    text = "First paragraph.\n\nSecond paragraph."
    sections = split_into_sections(text)
    assert [s.text for s in sections] == ["First paragraph.", "Second paragraph."]
    assert text[sections[0].start:sections[0].end] == sections[0].text
    assert text[sections[1].start:sections[1].end] == sections[1].text
