from durable_research.podcast_starter import parser


def test_starter_accepts_one_or_more_episode_keys() -> None:
    args = parser().parse_args(
        [
            "--mode",
            "live",
            "--episode-key",
            "mas-ep4",
            "--episode-key",
            "code-ep4",
        ]
    )

    assert args.episode_key == ["mas-ep4", "code-ep4"]
