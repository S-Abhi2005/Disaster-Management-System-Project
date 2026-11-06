from alembic.script import Script
from alembic.script import MakoTemplate
from alembic import util
from textwrap import dedent


def run(config, **kwargs):
    script = Script.from_config(config)
    template = MakoTemplate(
        dedent(
            """\
            ${{repr(up_revision)}} -> ${{repr(down_revision)}}${slug}
            """
        ),
        imports=(),
    )
    runner = script.generate_revision(
        util.rev_id(), "add new table", template=template, **kwargs
    )

    if runner:
        runner.write_script(template)
