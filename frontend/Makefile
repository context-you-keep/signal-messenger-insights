.PHONY: stop start restart dev

stop:
	@echo "Stopping dev server..."
	@ss -tlnp | grep ':3001 ' | awk '{print $$7}' | grep -o 'pid=[0-9]*' | cut -d= -f2 | xargs -r kill -9 || true
	@sleep 1
	@echo "Dev server stopped"

start:
	@nohup npm run dev > /tmp/nextjs-dev.log 2>&1 &
	@sleep 3
	@echo "Dev server started"

restart: stop
	@sleep 2
	@nohup npm run dev > /tmp/nextjs-dev.log 2>&1 &
	@sleep 3
	@echo "Dev server restarted"

dev: restart
