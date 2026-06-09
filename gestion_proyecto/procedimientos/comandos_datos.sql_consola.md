python manage.py shell -c "from blog.models import BlogPost; updated = BlogPost.objects.filter(is_published=True, moderation_status='pending').update(moderation_status='approved', approval_token=None, approval_token_created=None); print(f'Actualizados {updated} posts a approved')"



python manage.py shell -c "from blog.models import BlogPost; posts = BlogPost.objects.all().order_by('-id')[:5]; [print(f'ID={p.id} slug=\"{p.slug}\" title=\"{p.title}\" is_published={p.is_published} author={p.author}') for p in posts]"
:
22 objects imported automatically (use -v 2 for details).

ID=19 slug="2026-06-05_las-mejoras-de-uiux-que-hicieron-que-la-gente-se-quedara-un" title="Las Mejoras De Uiux Que Hicieron Que La Gente Se Quedara Un " is_published=True author=None
ID=18 slug="2026-06-04_test-2" title="Test 2" is_published=True author=None
ID=17 slug="2026-06-03_test-1" title="Test 1" is_published=True author=jaimediaz817
ID=16 slug="2026-06-03_test" title="Test" is_published=True author=jaimediaz817
ID=15 slug="2026-04-26_mejoras_ui_ux_blog_historico4" title="Mejoras Ui Ux Blog Historico4" is_published=True author=jaimediaz817

[05/Jun/2026 14:33:31] "GET /api/blog/2026-06-04_test-2/reactions/ HTTP/1.1" 200 36