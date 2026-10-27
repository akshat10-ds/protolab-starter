# Iris icon-reference repair

The two New chat controls referenced `pencil-box-small`, which is not an icon name in the installed catalog. Both now use `pencil-box`; the existing `size="small"` prop selects the independent 20px master.

This patch was authored in the isolated AI source, prepared with the Ink used-set exporter, and validated against the full Ink + AI source contracts before refreshing the generated IrisAgent file. The manifest records the source paths, backup, and before/after hashes. No other generated files changed during this refresh.

Apply `iris-icon.patch` to the corresponding AI source before future regeneration until this fix is included upstream.
