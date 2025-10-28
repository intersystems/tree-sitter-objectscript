from importlib.resources import files as _files
from ._binding import language_objectscript_core  

def _get_query(name, file):
    text = (_files(f"{__package__}.queries") / file).read_text()
    globals()[name] = text
    return text

def __getattr__(name):
    if name == "HIGHLIGHTS_QUERY":  return _get_query("HIGHLIGHTS_QUERY", "highlights.scm")
    if name == "INJECTIONS_QUERY":  return _get_query("INJECTIONS_QUERY", "injections.scm")
    if name == "INDENTS_QUERY":     return _get_query("INDENTS_QUERY", "indents.scm")
    raise AttributeError(name)
